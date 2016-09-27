<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>

	<meta http-equiv="Content-Type" content="text/html; charset=shift_jis" />
	<meta http-equiv="Content-style-Type" content="text/html; charset=Shift_JIS" />
	<title>�R���r�j���ϓ��̓e���v���[�g�T���v���@�o�f�}���`�y�C�����g�T�[�r�X</title>
	
	<link href="{$CSSPATH}/common.css" rel="stylesheet" type="text/css" />
	
	{literal}
	<script type="text/javascript">
		var submitted = false
		function blockForm(){
			if( submitted ){
				return false
			}
			submitted = true
			return true
		}
	</script>
	{/literal}
</head>

<body>

<div class="wrapper">
<div class="bodyinner">

	<!--�w�b�_�[�J�n-->
	<div class="header">
		<h1>{$ShopName|htmlspecialchars } ���x���葱��</h1>
	</div>

	<div class="flow">
		<ul>
			<li class="active">
				<a href="{$CancelURL|htmlspecialchars}">
					<span>�V���b�s���O�T�C�g�ɖ߂� Return to the online ticket website &lt;</span>
				</a>
			</li>
			{if $SelectURL ne null}
			<li  class="active">
				<a href="{$SelectURL|htmlspecialchars}">
					<span>���x�����@�̑I�� &gt;</span>
				</a>
			</li>
			{/if}
			<li  class="current">
				<span>�K�v�������L�� &gt;</span>
			</li>
			{if $Confirm eq '1'}
			<li>
				<span>�m�F���Ď葱�� &gt;</span>
			</li>
			{/if}
			<li>
				<span>���x�����@�̂��ē�</span>
			</li>
		</ul>
	</div>
	
	<div class="main">

		{if  $CheckMessageArray neq null }
		<div id="GP_msg">
			<ul>
			{foreach item=message from=$CheckMessageArray}
				<li>{$message}</li>
			{/foreach}
			</ul>
		</div>
		{/if}
	
		<form action="{$ExecURL|htmlspecialchars}" onsubmit="return blockForm()" method="post">
		
			<p>{insert name="input_keyItems"}</p>
			
			<div class="block">
				<div class="bl_title">
					<div class="bl_title_inner">
						<h2>
							<span class="p">�R���r�j�G���X�X�g�A���ς̕K�v���������L�����������B</span>
						</h2>
					</div>
				</div>
				
				<div class="bl_body">
					
					<table class="generic" summary="credit_1" id="credit">
						<tr>
							<th>�����p����R���r�j�̑I��<br />Select convenience store</th>
							<td>{insert name="select_cvsCorpList"}</td>
						</tr>
						<tr>
							<th>����<br />Name</th>
							<td>
								<input type="text" name="CustomerName" size='24' maxlength="20" value="{$CustomerName|htmlspecialchars}" />
								<p class="note">�S�p�ł��L����������</p>
							</td>
						</tr>
						<tr>
							<th>�t���K�i<br />Furigana</th>
							<td>
								<input type="text" name="CustomerKana" size='24' maxlength="20" value="{$CustomerKana|htmlspecialchars}" />
								<p class="note">�S�p�ł��L����������</p>
							</td>
						</tr>
						<tr>
							<th>�d�b�ԍ�<br />Telephone number</th>
							<td>
								<input type="text" name="TelNo" size='15' maxlength="13" class="code" value="{$TelNo|htmlspecialchars}" />
							</td>
						</tr>
						<tr>
							<th>���A���惁�[���A�h���X<br />Customer's email address</th>
							<td>
								<input type="text" name="MailAddress" size='24' maxlength="256" value="{$MailAddress|htmlspecialchars}" />
							</td>
						</tr>
					</table>
					<p class="control">
						<span class="submit">
							{if $Confirm eq "1"}
							<input type="submit" value="�m�F���� Confirm" />
							{else}
							<input type="submit" value="���ς��� Pay" />
							{/if}
						</span>
					</p>
				</div>
			</div>

			<div class="block">
				<div class="bl_title">
					<div class="bl_title_inner">
						<h2>
							<span class="p">�����p���e</span>
						</h2>
					</div>
				</div>
				
				<div class="bl_body">
		
					<div>
						<table id="cartinfo" class="generic">
							<tr>
								<th>�\��ԍ�<br />Reservation number</th>
								<td>{$ReserveNo|htmlspecialchars}</td>
							</tr>
							<tr>
								<th>����ԍ�<br />Membership number</th>
								<td>{$MemberNo|htmlspecialchars}</td>
							</tr>
							<tr>
								<th>���i��<br />Ticket price</th>
								<td>{$Amount|number_format|htmlspecialchars}�~</td>
							</tr>
							<tr>
								<th>�ő���<br />Tax and postage</th>
								<td>{$Tax|number_format|htmlspecialchars}�~</td>
							</tr>
							<tr>
								<th>���x�����v<br />Total payment</th>
								<td>{$Total|number_format|htmlspecialchars}�~</td>
							</tr>
						</table>
					</div>
					
				</div>
				
			</div>
						
			<br class="clear" />
			
		</form>
	</div>

</div>
</div>
{* �f�o�b�O���K�v�ȏꍇ�A�ȉ��̍s�� * ���폜���āA�R�����g���O���Ă��������B *}
{*insert name="debug_showAllVars"*}
</body>
</html>